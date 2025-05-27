using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ProjectManagementApp.API.Models
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<ProfileCard> ProfileCards { get; set; } = null!;
        public DbSet<Project> Projects { get; set; } = null!;
        public DbSet<TaskItem> Tasks { get; set; } = null!;
        public DbSet<TaskHistory> TaskHistories { get; set; } = null!;
        public DbSet<ProjectHistory> ProjectHistories { get; set; } = null!;
        public DbSet<Discrepancy> Discrepancies { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<UserAvailability> UserAvailabilities { get; set; } = null!;
        public DbSet<ProjectMember> ProjectMembers { get; set; } = null!;
    }

}