// This is finicky, so let's not use it

export {};

// import { EventSourcePolyfill } from "event-source-polyfill";
// import { useEffect, useState } from "react";

// interface EventSourceConfigType {
//   HEADERS?: Record<string, string>;
//   BASE?: string;
// }

// export const EventSourceConfig: EventSourceConfigType = {
//   HEADERS: undefined,
//   BASE: undefined,
// };

// /**
//  * @param url The URL to connect to. This should be a relative URL, with no
//  * leading underscore, as the base URL is set in the config.
//  */
// export default function useEventSource(url: string) {
//   const [data, setData] = useState(null);
//   const [stream, setStream] = useState<EventSourcePolyfill | null>(null);

//   useEffect(() => {
//     if (stream === null) {
//       // we only want one of these at a time, so it needs to be part of state
//       const source = new EventSourcePolyfill(
//         `${EventSourceConfig.BASE}/${url}`,
//         {
//           headers: EventSourceConfig.HEADERS,
//         }
//       );
//       source.onmessage = (event) => {
//         setData(JSON.parse(event.data));
//       };
//       setStream(source);
//     }
//     return () => {
//       if (stream !== null) {
//         stream.close();
//       }
//     };
//   }, [url, stream]);

//   return data;
// }
