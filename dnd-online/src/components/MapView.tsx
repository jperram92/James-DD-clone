import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Rect, Group } from 'react-konva';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { useGameStore } from '../store/gameStore';

interface MapViewProps {
  isDM: boolean;
}

const MapView = ({ isDM }: MapViewProps) => {
  const { user } = useAuth();
  const { currentCampaign, currentMap, setCurrentMap } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [fogGrid, setFogGrid] = useState<boolean[][]>([]);
  const [gridSize, setGridSize] = useState({ width: 20, height: 20 });
  const [showGrid, setShowGrid] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);

  const stageRef = useRef<any>(null);

  // Fetch map data
  useEffect(() => {
    const fetchMap = async () => {
      try {
        if (!currentCampaign) return;

        setLoading(true);

        // Get map for this campaign
        try {
          const { data, error } = await supabase
            .from('maps')
            .select('*')
            .eq('campaign_id', currentCampaign.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Check if we got any data
          if (data && data.length > 0) {
            const mapData = data[0];
            setCurrentMap(mapData);

            // Load fog of war grid
            const fogData = mapData.fog_of_war_grid as any;
            if (fogData && Array.isArray(fogData.grid)) {
              setFogGrid(fogData.grid);
            } else {
              // Create default grid (all covered)
              const rows = 20;
              const cols = 30;
              const newGrid = Array(rows).fill(null).map(() => Array(cols).fill(true));
              setFogGrid(newGrid);
            }

            // Load map image
            if (mapData.map_image_url) {
              const img = new window.Image();
              img.src = mapData.map_image_url;
              img.onload = () => {
                setMapImage(img);
                setLoading(false);
              };
              img.onerror = () => {
                setError('Failed to load map image.');
                setLoading(false);
              };
            } else {
              setLoading(false);
            }
          } else {
            // No map yet
            setLoading(false);
          }
          return; // Exit early since we've handled everything
        } catch (queryError) {
          console.error('Error querying maps:', queryError);
          // Continue to the error handling below
        }

        // This section is now handled in the try/catch block above
        setLoading(false);
      } catch (error) {
        console.error('Error fetching map:', error);
        setError('Failed to load map data.');
        setLoading(false);
      }
    };

    fetchMap();

    // Set up realtime subscription for map updates
    if (currentCampaign) {
      const mapSubscription = supabase
        .channel(`map:${currentCampaign.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'maps',
          filter: `campaign_id=eq.${currentCampaign.id}`
        }, (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setCurrentMap(payload.new);

            // Update fog grid
            const fogData = payload.new.fog_of_war_grid as any;
            if (fogData && Array.isArray(fogData.grid)) {
              setFogGrid(fogData.grid);
            }

            // Update map image if URL changed
            if (payload.new.map_image_url !== currentMap?.map_image_url) {
              const img = new window.Image();
              img.src = payload.new.map_image_url;
              img.onload = () => setMapImage(img);
            }
          }
        })
        .subscribe();

      // Clean up subscription
      return () => {
        mapSubscription.unsubscribe();
      };
    }
  }, [currentCampaign, currentMap?.map_image_url, setCurrentMap]);

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();

    const pointerPosition = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointerPosition.x - stage.x()) / oldScale,
      y: (pointerPosition.y - stage.y()) / oldScale,
    };

    const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setScale(newScale);
    setPosition({
      x: pointerPosition.x - mousePointTo.x * newScale,
      y: pointerPosition.y - mousePointTo.y * newScale,
    });
  };

  // Handle fog of war toggle (DM only)
  const handleCellClick = (row: number, col: number) => {
    if (!isDM || !currentMap) return;

    // Toggle fog for the cell
    const newFogGrid = [...fogGrid];
    newFogGrid[row][col] = !newFogGrid[row][col];
    setFogGrid(newFogGrid);

    // Update in database
    updateFogOfWar(newFogGrid);
  };

  // Update fog of war in database
  const updateFogOfWar = async (grid: boolean[][]) => {
    try {
      if (!currentCampaign || !currentMap) return;

      await supabase
        .from('maps')
        .update({
          fog_of_war_grid: { grid },
        })
        .eq('id', currentMap.id);
    } catch (error) {
      console.error('Error updating fog of war:', error);
    }
  };

  // Upload a new map (DM only)
  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!isDM || !currentCampaign || !e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentCampaign.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `maps/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('maps')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('maps')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Create or update map in database
      if (currentMap) {
        // Update existing map
        await supabase
          .from('maps')
          .update({
            map_image_url: publicUrl,
          })
          .eq('id', currentMap.id);
      } else {
        // Create new map
        // Create default grid (all covered)
        const rows = 20;
        const cols = 30;
        const newGrid = Array(rows).fill(null).map(() => Array(cols).fill(true));

        await supabase
          .from('maps')
          .insert({
            campaign_id: currentCampaign.id,
            map_image_url: publicUrl,
            fog_of_war_grid: { grid: newGrid },
          });
      }
    } catch (error) {
      console.error('Error uploading map:', error);
      setError('Failed to upload map. Please try again.');
    }
  };

  // Render grid cells with fog of war
  const renderGrid = () => {
    if (!mapImage || !showGrid) return null;

    const cellWidth = mapImage.width / gridSize.width;
    const cellHeight = mapImage.height / gridSize.height;

    const cells = [];

    for (let row = 0; row < fogGrid.length; row++) {
      for (let col = 0; col < (fogGrid[row]?.length || 0); col++) {
        const isFogged = fogGrid[row][col];
        const isSelected = selectedCell?.row === row && selectedCell?.col === col;

        // Only render fog cells or selected cell
        if (isFogged || isSelected) {
          cells.push(
            <Rect
              key={`${row}-${col}`}
              x={col * cellWidth}
              y={row * cellHeight}
              width={cellWidth}
              height={cellHeight}
              fill={isFogged ? 'rgba(0, 0, 0, 0.7)' : 'transparent'}
              stroke={isSelected ? '#ff0000' : 'rgba(255, 255, 255, 0.1)'}
              strokeWidth={isSelected ? 2 : 0.5}
              onClick={() => handleCellClick(row, col)}
              onTap={() => handleCellClick(row, col)}
              onMouseEnter={() => isDM && setSelectedCell({ row, col })}
              onMouseLeave={() => isDM && setSelectedCell(null)}
            />
          );
        }
      }
    }

    return cells;
  };

  return (
    <div className="map-view">
      <div className="map-controls">
        {isDM && (
          <div className="map-upload">
            <input
              type="file"
              id="map-upload"
              accept="image/*"
              onChange={handleMapUpload}
              className="hidden-input"
            />
            <label htmlFor="map-upload" className="btn btn-secondary">
              {currentMap ? 'Change Map' : 'Upload Map'}
            </label>
          </div>
        )}

        <button
          type="button"
          className={`btn ${showGrid ? 'btn-active' : ''}`}
          onClick={() => setShowGrid(!showGrid)}
        >
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
        >
          Reset View
        </button>
      </div>

      <div className="map-container" onWheel={handleWheel}>
        {loading ? (
          <div className="map-loading">Loading map...</div>
        ) : error ? (
          <div className="map-error">{error}</div>
        ) : !mapImage ? (
          <div className="map-empty">
            {isDM ? 'Upload a map to get started.' : 'No map available yet.'}
          </div>
        ) : (
          <Stage
            ref={stageRef}
            width={window.innerWidth * 0.7}
            height={window.innerHeight * 0.7}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
          >
            <Layer>
              <Image image={mapImage} />
              <Group>{renderGrid()}</Group>
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
};

export default MapView;
