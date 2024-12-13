import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stack } from "@/components/ui/stack";

const FILE_BUCKET = "files";

export default function FileUploader() {
  // const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  // const isSSR = useIsSSR();
  // const router = useRouter();
  // const [isPending, startTransition] = useTransition();
  // const { mutateApp } = useApp(appId);

  // const handleUpload = () => {
  //   const inputElement = document.getElementById("files") as HTMLInputElement;
  //   const acceptedFiles = Array.from(inputElement.files || []);
  //   if (acceptedFiles.length === 0) {
  //     setUploadStatus("No files selected");
  //     return;
  //   }
  //   acceptedFiles.forEach(async (file) => {
  //     const fileName = crypto.randomUUID();
  //     const { data: storageData, error: storageError } = await supabase!.storage
  //       .from(FILE_BUCKET)
  //       .upload(fileName, file);
  //     if (storageError) {
  //       setUploadStatus("Error");
  //       throw Error(`${storageError.name} - ${storageError.message}`);
  //     }
  //     const { data: fileData, error: fileError } = await supabase
  //       .from("file")
  //       .insert({
  //         name: file.name,
  //         size: file.size,
  //         bucket_id: FILE_BUCKET,
  //         object_path: storageData.path,
  //         user_id: "1233",
  //       })
  //       .select("*")
  //       .single();
  //     if (fileError) {
  //       setUploadStatus("Error");
  //       throw Error(fileError.message);
  //     }
  //     const { data: appFileData, error: appFileError } = await supabase
  //       .from("app_db_file")
  //       .insert({
  //         file_id: fileData.id,
  //         app_id: appId,
  //       })
  //       .select("*")
  //       .single();
  //     if (appFileError) {
  //       setUploadStatus("Error");
  //       throw Error(appFileError.message);
  //     }

  //     // update the view
  //     mutateApp(
  //       async (data) => {
  //         // TODO fix error,
  //         if (!data) return data;
  //         return {
  //           ...data,
  //           app_db_file: [
  //             {
  //               file: fileData,
  //               created_at: appFileData.created_at,
  //             },
  //             ...(data?.app_db_file || []),
  //           ],
  //         };
  //       },
  //       {
  //         revalidate: false,
  //       }
  //     );
  //   });

  //   setUploadStatus("Upload complete");

  //   startTransition(() => {
  //     // Refresh the current route and fetch new data from the server without
  //     // losing client-side browser or React state.
  //     router.refresh();
  //   });
  // };

  // const handleChange = () => {
  //   setUploadStatus(null);
  // };

  return (
    <>
      <Label htmlFor="files">Click to choose files or drag and drop:</Label>
      <Stack direction="row" gap={2}>
        <Input
          id="files"
          type="file"
          multiple
          // disabled={isSSR}
          // onChange={handleChange}
        />
        <Button
        // onClick={handleUpload} disabled={isSSR}
        >
          Upload
        </Button>
      </Stack>
      {<div className="h-6">{/* {uploadStatus} */}</div>}
    </>
  );
}
