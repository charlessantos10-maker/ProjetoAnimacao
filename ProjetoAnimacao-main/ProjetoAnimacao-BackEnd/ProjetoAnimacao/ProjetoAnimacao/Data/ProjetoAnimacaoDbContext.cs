using Microsoft.EntityFrameworkCore;
using ProjetoAnimacao.Models;

namespace ProjetoAnimacao.Data;

public class ProjetoAnimacaoDbContext(DbContextOptions<ProjetoAnimacaoDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<CreativeProject> Projects => Set<CreativeProject>();
    public DbSet<ProjectFile> ProjectFiles => Set<ProjectFile>();
    public DbSet<SocialAccount> SocialAccounts => Set<SocialAccount>();
    public DbSet<Publication> Publications => Set<Publication>();
    public DbSet<Proposal> Proposals => Set<Proposal>();
    public DbSet<ProposalEvaluation> ProposalEvaluations => Set<ProposalEvaluation>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<User>().Property(x => x.Email).HasMaxLength(256);
        modelBuilder.Entity<User>().Property(x => x.Name).HasMaxLength(120);

        modelBuilder.Entity<CreativeProject>()
            .HasOne(x => x.User).WithMany(x => x.Projects)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProjectFile>()
            .HasOne(x => x.Project).WithMany(x => x.Files)
            .HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SocialAccount>()
            .HasOne(x => x.User).WithMany(x => x.SocialAccounts)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Publication>()
            .HasOne(x => x.User).WithMany(x => x.Publications)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Proposal>()
            .HasOne(x => x.User).WithMany(x => x.Proposals)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProposalEvaluation>()
            .HasOne(x => x.Proposal).WithOne(x => x.Evaluation)
            .HasForeignKey<ProposalEvaluation>(x => x.ProposalId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notification>()
            .HasOne(x => x.User).WithMany(x => x.Notifications)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        base.OnModelCreating(modelBuilder);
    }
}
