using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoAnimacao.Contracts;
using ProjetoAnimacao.Data;
using ProjetoAnimacao.Models;

namespace ProjetoAnimacao.Controllers;

[ApiController]
[Authorize]
[Route("api")]
public class WorkspaceController(ProjetoAnimacaoDbContext db) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("social-accounts")]
    public async Task<IActionResult> GetSocialAccounts() =>
        Ok(await db.SocialAccounts.Where(x => x.UserId == UserId).ToListAsync());

    [HttpPost("social-accounts")]
    public async Task<IActionResult> AddSocialAccount(CreateSocialAccountRequest request)
    {
        var allowed = new[] { "Instagram", "Facebook", "YouTube", "X" };
        if (!allowed.Contains(request.Platform))
            return BadRequest("Plataforma não permitida.");
        if (!Uri.TryCreate(request.ProfileUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return BadRequest("Informe uma URL válida.");

        var item = new SocialAccount
        {
            UserId = UserId,
            Platform = request.Platform,
            ProfileUrl = request.ProfileUrl
        };
        db.SocialAccounts.Add(item);
        await db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("social-accounts/{id:guid}")]
    public async Task<IActionResult> DeleteSocialAccount(Guid id)
    {
        var item = await db.SocialAccounts.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (item is null) return NotFound();
        db.SocialAccounts.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("publications")]
    public async Task<IActionResult> GetPublications() =>
        Ok(await db.Publications.Where(x => x.UserId == UserId)
            .OrderByDescending(x => x.CreatedAtUtc).ToListAsync());

    [HttpPost("publications")]
    public async Task<IActionResult> CreatePublication(CreatePublicationRequest request)
    {
        if (request.ProjectId.HasValue &&
            !await db.Projects.AnyAsync(x => x.Id == request.ProjectId && x.UserId == UserId))
            return NotFound("Projeto não encontrado.");

        var allowed = new[] { "Instagram", "Facebook", "YouTube", "X" };
        if (!allowed.Contains(request.Platform)) return BadRequest("Rede social inválida.");

        var publication = new Publication
        {
            UserId = UserId,
            ProjectId = request.ProjectId,
            Platform = request.Platform,
            Description = request.Description,
            ExternalUrl = request.ExternalUrl,
            Status = "Prepared"
        };
        db.Publications.Add(publication);
        await db.SaveChangesAsync();
        return Ok(publication);
    }

    [HttpGet("proposals")]
    public async Task<IActionResult> GetProposals() =>
        Ok(await db.Proposals.Where(x => x.UserId == UserId)
            .Include(x => x.Evaluation)
            .OrderByDescending(x => x.ReceivedAtUtc).ToListAsync());

    [HttpPost("proposals")]
    public async Task<IActionResult> CreateProposal(CreateProposalRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CompanyName) ||
            string.IsNullOrWhiteSpace(request.ServiceDescription))
            return BadRequest("Informe a empresa e o serviço solicitado.");

        if (!string.IsNullOrWhiteSpace(request.CompanyWebsite) &&
            (!Uri.TryCreate(request.CompanyWebsite, UriKind.Absolute, out var uri) ||
             (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)))
            return BadRequest("Site da empresa inválido.");

        var proposal = new Proposal
        {
            UserId = UserId,
            CompanyName = request.CompanyName.Trim(),
            ServiceDescription = request.ServiceDescription.Trim(),
            OfferedAmount = request.OfferedAmount,
            CompanyWebsite = request.CompanyWebsite,
            Details = request.Details
        };

        db.Proposals.Add(proposal);
        db.Notifications.Add(new Notification
        {
            UserId = UserId,
            Title = "Proposta registrada",
            Message = $"A proposta de {proposal.CompanyName} foi adicionada à sua área de verificações."
        });

        await db.SaveChangesAsync();
        return Ok(proposal);
    }

    [HttpPut("proposals/{id:guid}/evaluation")]
    public async Task<IActionResult> SaveEvaluation(Guid id, SaveEvaluationRequest request)
    {
        var proposal = await db.Proposals
            .Include(x => x.Evaluation)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);

        if (proposal is null) return NotFound();

        var decisions = new[] { "UnderReview", "Accept", "Negotiate", "Reject" };
        if (!decisions.Contains(request.Decision))
            return BadRequest("Decisão inválida.");

        var evaluation = proposal.Evaluation ?? new ProposalEvaluation { ProposalId = id };
        evaluation.ReputationNotes = request.ReputationNotes;
        evaluation.TargetAudienceNotes = request.TargetAudienceNotes;
        evaluation.CompatibilityNotes = request.CompatibilityNotes;
        evaluation.RightsAndPaymentNotes = request.RightsAndPaymentNotes;
        evaluation.Decision = request.Decision;
        evaluation.UpdatedAtUtc = DateTime.UtcNow;

        if (proposal.Evaluation is null)
            db.ProposalEvaluations.Add(evaluation);

        proposal.Status = request.Decision;
        await db.SaveChangesAsync();
        return Ok(evaluation);
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications() =>
        Ok(await db.Notifications.Where(x => x.UserId == UserId)
            .OrderByDescending(x => x.CreatedAtUtc).ToListAsync());

    [HttpPut("notifications/{id:guid}/read")]
    public async Task<IActionResult> MarkNotificationRead(Guid id)
    {
        var notification = await db.Notifications
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId);
        if (notification is null) return NotFound();

        notification.ReadAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
