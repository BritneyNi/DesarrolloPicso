using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

public class AzureBlobService : IAzureBlobService
{
    private readonly BlobServiceClient? _blobServiceClient;
    private readonly bool _isConfigured;

    public AzureBlobService(IConfiguration config)
    {
        var connectionString = config["AzureBlobStorage:ConnectionString"];
        _isConfigured = !string.IsNullOrWhiteSpace(connectionString);
        if (_isConfigured)
        {
            _blobServiceClient = new BlobServiceClient(connectionString);
        }
    }

    public async Task<string> UploadBase64Async(
        string base64,
        string containerName,
        string fileName)
    {
        if (!_isConfigured || _blobServiceClient == null)
        {
            return $"https://placeholder.local/{containerName}/{fileName}";
        }

        var container = _blobServiceClient.GetBlobContainerClient(containerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.None);

        var base64Data = base64.Contains(",") ? base64.Split(',')[1] : base64;
        var bytes = Convert.FromBase64String(base64Data);
        var blob = container.GetBlobClient(fileName);
        using var stream = new MemoryStream(bytes);
        await blob.UploadAsync(stream, overwrite: true);
        return blob.Uri.ToString();
    }
}