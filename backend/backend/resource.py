import boto3
import io
import asyncio


async def load_pdb():
    bucket_name = "brainshare-primary-6944fc2"
    object_key = "entries.idx"
    s3 = boto3.client("s3")

    try:
        # Create a BytesIO buffer
        buffer = io.BytesIO()

        # Download the file into the buffer
        s3.download_fileobj(bucket_name, object_key, buffer)

        # Reset the buffer's cursor to the beginning
        buffer.seek(0)

        # Use the content as needed
        file_content = buffer.read()
        print(f"File loaded into memory. Content length: {len(file_content)} bytes")

        # If the file is a text file, decode it
        # file_content.decode('utf-8')

    except Exception as e:
        print(f"An error occurred: {e}")

    print("done")


if __name__ == "__main__":
    asyncio.run(load_pdb())
