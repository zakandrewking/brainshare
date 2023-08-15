import { useParams } from "react-router-dom";
import useSWR from "swr";

export default function File() {
  const { id } = useParams();

  const { data: files, error } = useSWR(`/file/${id}`);

  if (error) return <div>failed to load</div>;
  if (!files) return <div>loading...</div>;

  return (
    <div>
      {files.map((file: any) => (
        <div key={file.id}>{file.name}</div>
      ))}
    </div>
  );
}
