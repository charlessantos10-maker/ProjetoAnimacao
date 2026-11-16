using ProjetoAnimacao.Data;
using ProjetoAnimacao.Models;
using Microsoft.EntityFrameworkCore;

namespace ProjetoAnimacao.Contracts
{
    public record RegisterRequest(
        string Name,
        string Email,
        string Password
    );

    public record LoginRequest(
        string Email,
        string Password
    );

    public record AuthResponse(
        string Token,
        DateTime ExpiresAtUtc,
        UserResponse User
    );

    public record UserResponse(
        Guid Id,
        string Name,
        string Email
    );

    public record CreateProjectRequest(
        string Title,
        string? Description,
        string Type
    );

    public record UpdateProjectRequest(
        string Title,
        string? Description,
        string Type
    );

    public record CreateSocialAccountRequest(
        string Platform,
        string ProfileUrl
    );

    public record CreatePublicationRequest(
        Guid? ProjectId,
        string Platform,
        string Description,
        string? ExternalUrl
    );

    public record CreateProposalRequest(
        string CompanyName,
        string ServiceDescription,
        decimal? OfferedAmount,
        string? CompanyWebsite,
        string Details
    );

    public record SaveEvaluationRequest(
        string? ReputationNotes,
        string? TargetAudienceNotes,
        string? CompatibilityNotes,
        string? RightsAndPaymentNotes,
        string Decision
    );
}