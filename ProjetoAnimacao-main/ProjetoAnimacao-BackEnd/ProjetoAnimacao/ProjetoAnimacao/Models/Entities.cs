namespace ProjetoAnimacao.Models
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public ICollection<CreativeProject> Projects { get; set; } = [];
        public ICollection<SocialAccount> SocialAccounts { get; set; } = [];
        public ICollection<Publication> Publications { get; set; } = [];
        public ICollection<Proposal> Proposals { get; set; } = [];
        public ICollection<Notification> Notifications { get; set; } = [];
    }

    public class CreativeProject
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        // Valores previstos: Art, Comic ou Animation.
        public string Type { get; set; } = "Art";
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
        public ICollection<ProjectFile> Files { get; set; } = [];
    }

    public class ProjectFile
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ProjectId { get; set; }
        public CreativeProject? Project { get; set; }
        public string OriginalFileName { get; set; } = "";
        public string StoredFileName { get; set; } = "";
        public string ContentType { get; set; } = "application/octet-stream";
        public long SizeBytes { get; set; }
        public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
    }

    public class SocialAccount
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public string Platform { get; set; } = "";
        public string ProfileUrl { get; set; } = "";
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }

    public class Publication
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public Guid? ProjectId { get; set; }
        public string Platform { get; set; } = "";
        public string Description { get; set; } = "";
        public string? ExternalUrl { get; set; }
        public string Status { get; set; } = "Draft";
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }

    public class Proposal
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public string CompanyName { get; set; } = "";
        public string ServiceDescription { get; set; } = "";
        public decimal? OfferedAmount { get; set; }
        public string? CompanyWebsite { get; set; }
        public string Details { get; set; } = "";
        public string Status { get; set; } = "Pending";
        public DateTime ReceivedAtUtc { get; set; } = DateTime.UtcNow;
        public ProposalEvaluation? Evaluation { get; set; }
    }

    public class ProposalEvaluation
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ProposalId { get; set; }
        public Proposal? Proposal { get; set; }
        public string? ReputationNotes { get; set; }
        public string? TargetAudienceNotes { get; set; }
        public string? CompatibilityNotes { get; set; }
        public string? RightsAndPaymentNotes { get; set; }
        public string Decision { get; set; } = "UnderReview";
        public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    }

    public class Notification
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public string Title { get; set; } = "";
        public string Message { get; set; } = "";
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? ReadAtUtc { get; set; }
    }

}

