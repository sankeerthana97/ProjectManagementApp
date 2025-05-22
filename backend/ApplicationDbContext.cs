using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApp.API.Models;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<ProfileCard> ProfileCards { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<TaskItem> Tasks { get; set; }
    public DbSet<TaskHistory> TaskHistories { get; set; }
    public DbSet<ProjectHistory> ProjectHistories { get; set; }
    public DbSet<Discrepancy> Discrepancies { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<UserAvailability> UserAvailabilities { get; set; }
} 