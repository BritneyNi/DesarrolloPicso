using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

public class BlobService
{
    private readonly string? _connectionString;
    private readonly string? _defaultContainer;
    private readonly bool _isConfigured;

    public BlobService(IConfiguration config)
    {
        _connectionString = config.GetValue<string>("AzureBlobStorage:ConnectionString");
        _defaultContainer = config.GetValue<string>("AzureBlobStorage:EvidenciasContainer");
        _isConfigured = !string.IsNullOrWhiteSpace(_connectionString);
    }

    public async Task<string> UploadFileAsync(IFormFile file)
    {
        return await UploadFileAsync(file, _defaultContainer ?? "evidencias");
    }

    public async Task<string> UploadFileAsync(IFormFile file, string containerName)
    {
        if (!_isConfigured)
        {
            return $"https://placeholder.local/{containerName}/{Guid.NewGuid()}_{file.FileName}";
        }

        var container = new BlobContainerClient(_connectionString, containerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.Blob);
        var blobName = $"{Guid.NewGuid()}_{file.FileName}";
        var blobClient = container.GetBlobClient(blobName);
        using var stream = file.OpenReadStream();
        await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType });
        return blobClient.Uri.ToString();
    }
}