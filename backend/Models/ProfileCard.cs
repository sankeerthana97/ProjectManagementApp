namespace ProjectManagementApp.API.Models
{
    public class ProfileCard
    {
        public int Id { get; set; }
<<<<<<< Updated upstream
        public string UserId { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty ;
        public string Experience { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public ApplicationUser User { get; set; } = new ApplicationUser();
=======
        public required string UserId { get; set; }
        public required string Skills { get; set; }
        public required string Experience { get; set; }
        public string? ProfileImageUrl { get; set; }
        public required ApplicationUser User { get; set; }
>>>>>>> Stashed changes
    }
} 