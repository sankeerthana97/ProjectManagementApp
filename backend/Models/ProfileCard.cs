namespace ProjectManagementApp.API.Models
{
    public class ProfileCard
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Skills { get; set; }
        public string Experience { get; set; }
        public string? ProfileImageUrl { get; set; }
        public ApplicationUser User { get; set; }
    }
} 