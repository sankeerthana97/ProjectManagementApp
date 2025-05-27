namespace ProjectManagementApp.API.Models
{
    public class ProfileCard
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty;
        public string Experience { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public ApplicationUser User { get; set; } = null!;
    }
} 