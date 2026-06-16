using Azure.Storage.Blobs;

public class PlantillasPermisosService
{
    private readonly BlobContainerClient? _container;
    private readonly bool _isConfigured;

    public PlantillasPermisosService(IConfiguration config)
    {
        var connectionString = config["AzureStoragePermisos:ConnectionString"];
        var containerName = config["AzureStoragePermisos:PlantillasContainer"];

        _isConfigured = !string.IsNullOrWhiteSpace(connectionString);
        if (_isConfigured)
        {
            _container = new BlobContainerClient(connectionString, containerName);
        }
    }

    public async Task<Stream> ObtenerPlantillaStreamAsync(string nombreArchivo)
    {
        if (!_isConfigured || _container == null)
            throw new InvalidOperationException("Azure Storage no está configurado");

        var blob = _container.GetBlobClient(nombreArchivo);

        if (!await blob.ExistsAsync())
            throw new FileNotFoundException("La plantilla no existe en Azure", nombreArchivo);

        var ms = new MemoryStream();
        await blob.DownloadToAsync(ms);
        ms.Position = 0;
        return ms;
    }
}