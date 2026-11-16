using Microsoft.AspNetCore.Mvc;

namespace ProjetoAnimacao.Services;

public class FileStorageService(IWebHostEnvironment environment, IConfiguration configuration)
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm", ".pdf"
    };

    public async Task<(string StoredName, long Size)> SaveAsync(
        IFormFile file, Guid userId, CancellationToken cancellationToken)
    {
        if (file.Length == 0) throw new InvalidOperationException("O arquivo está vazio.");
        if (file.Length > 25 * 1024 * 1024) throw new InvalidOperationException("O limite por arquivo é 25 MB.");

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension))
            throw new InvalidOperationException("Tipo de arquivo não permitido.");

        var root = configuration["Storage:RootPath"] ?? "App_Data/uploads";
        var directory = Path.Combine(environment.ContentRootPath, root, userId.ToString("N"));
        Directory.CreateDirectory(directory);

        var storedName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var fullPath = Path.Combine(directory, storedName);

        await using var stream = new FileStream(fullPath, FileMode.CreateNew);
        await file.CopyToAsync(stream, cancellationToken);

        return (storedName, file.Length);
    }

    public string GetPath(Guid userId, string storedName)
    {
        var root = configuration["Storage:RootPath"] ?? "App_Data/uploads";
        return Path.Combine(environment.ContentRootPath, root, userId.ToString("N"), storedName);
    }

    public void Delete(Guid userId, string storedName)
    {
        var path = GetPath(userId, storedName);
        if (File.Exists(path)) File.Delete(path);
    }
}
