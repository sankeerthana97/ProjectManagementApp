namespace ProjectManagementApp.API.Models
{
    public class ProfileCard
    {
        public int Id { get; set; }
        public required string UserId { get; set; }
        public required string Skills { get; set; }
        public required string Experience { get; set; }
        public string? ProfileImageUrl { get; set; }
        public required ApplicationUser User { get; set; }
    }
} 