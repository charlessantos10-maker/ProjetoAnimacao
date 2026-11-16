using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoAnimacao.Contracts;
using ProjetoAnimacao.Data;
using ProjetoAnimacao.Models;
using ProjetoAnimacao.Services;

namespace ProjetoAnimacao.Controllers;

[ApiController]
[Authorize]
[Route("api/projects")]
public class ProjectsController(
    ProjetoAnimacaoDbContext db,
    FileStorageService storage) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static readonly string[] ValidTypes = ["Art", "Comic", "Animation"];

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await db.Projects.Where(x => x.UserId == UserId)
            .OrderByDescending(x => x.UpdatedAtUtc)
            .Select(x => new { x.Id, x.Title, x.Description, x.Type, x.CreatedAtUtc, x.UpdatedAtUtc })
            .ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var project = await db.Projects
            .Include(x => x.Files)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);

        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateProjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || !ValidTypes.Contains(request.Type))
            return BadRequest("Título obrigatório. Tipo permitido: Art, Comic ou Animation.");

        var project = new CreativeProject
        {
            UserId = UserId,
            Title = request.Title.Trim(),
            Description = request.Description,
            Type = request.Type
        };

        db.Projects.Add(project);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = project.Id }, project);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateProjectRequest request)
    {
        var project = await db.Projects.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (project is null) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Title) || !ValidTypes.Contains(request.Type))
            return BadRequest("Título ou tipo inválido.");

        project.Title = request.Title.Trim();
        project.Description = request.Description;
        project.Type = request.Type;
        project.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var project = await db.Projects.Include(x => x.Files)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (project is null) return NotFound();

        foreach (var file in project.Files)
            storage.Delete(UserId, file.StoredFileName);

        db.Projects.Remove(project);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/files")]
    [RequestSizeLimit(26 * 1024 * 1024)]
    public async Task<IActionResult> Upload(Guid id, IFormFile file, CancellationToken cancellationToken)
    {
        var project = await db.Projects.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (project is null) return NotFound();
        if (file is null) return BadRequest("Selecione um arquivo.");

        try
        {
            var (storedName, size) = await storage.SaveAsync(file, UserId, cancellationToken);
            var record = new ProjectFile
            {
                ProjectId = id,
                OriginalFileName = Path.GetFileName(file.FileName),
                StoredFileName = storedName,
                ContentType = file.ContentType,
                SizeBytes = size
            };

            db.ProjectFiles.Add(record);
            project.UpdatedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Ok(new { record.Id, record.OriginalFileName, record.ContentType, record.SizeBytes });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id:guid}/files/{fileId:guid}")]
    public async Task<IActionResult> Download(Guid id, Guid fileId)
    {
        var file = await db.ProjectFiles
            .Include(x => x.Project)
            .FirstOrDefaultAsync(x => x.Id == fileId && x.ProjectId == id && x.Project!.UserId == UserId);

        if (file is null) return NotFound();

        var path = storage.GetPath(UserId, file.StoredFileName);
        if (!System.IO.File.Exists(path)) return NotFound("Arquivo não encontrado no armazenamento.");

        return PhysicalFile(path, file.ContentType, file.OriginalFileName);
    }

    [HttpDelete("{id:guid}/files/{fileId:guid}")]
    public async Task<IActionResult> DeleteFile(Guid id, Guid fileId)
    {
        var file = await db.ProjectFiles
            .Include(x => x.Project)
            .FirstOrDefaultAsync(x => x.Id == fileId && x.ProjectId == id && x.Project!.UserId == UserId);

        if (file is null) return NotFound();

        storage.Delete(UserId, file.StoredFileName);
        db.ProjectFiles.Remove(file);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
