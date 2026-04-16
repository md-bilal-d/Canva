import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';

export default function useScenes(ydoc) {
  const [scenes, setScenes] = useState([]);
  const yScenesRef = useRef(null);

  useEffect(() => {
    if (!ydoc) return;
    const yArr = ydoc.getArray('scenes');
    yScenesRef.current = yArr;

    const observe = () => {
      setScenes(yArr.toArray());
    };

    yArr.observe(observe);
    observe(); // initial fetch

    return () => {
      yArr.unobserve(observe);
    };
  }, [ydoc]);

  const addScene = useCallback((name, x, y, scale) => {
    if (!yScenesRef.current) return;
    const scene = {
      id: 'scene-' + Date.now(),
      name: name || `Scene ${scenes.length + 1}`,
      x,
      y,
      scale,
    };
    yScenesRef.current.push([scene]);
  }, [scenes]);

  const removeScene = useCallback((index) => {
    if (!yScenesRef.current) return;
    yScenesRef.current.delete(index, 1);
  }, []);

  const updateScene = useCallback((index, name) => {
     if (!yScenesRef.current) return;
     const scene = yScenesRef.current.get(index);
     if (scene) {
         // Y.Array requires delete and insert to update an object reference
         yScenesRef.current.delete(index, 1);
         yScenesRef.current.insert(index, [{ ...scene, name }]);
     }
  }, []);

  return { scenes, addScene, removeScene, updateScene };
}
