public interface IAzureBlobService
{
    Task<string> UploadBase64Async(
        string base64,
        string containerName,
        string fileName
    );
}
