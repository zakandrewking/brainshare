import { MutableRefObject, useEffect, useState } from "react";

/***
 * https://stackoverflow.com/a/60978633/1118565
 */
export default function useContainerDimensions(myRef: MutableRefObject<any>) {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    setDimensions(myRef.current.getClientRects()[0]);

    const handleResize = () => {
      setDimensions(myRef.current.getClientRects()[0]);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [myRef]);

  return dimensions;
}
