using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ProjectManagementApp.API.Models;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ProjectManagementApp.API.Services
{
    public class TaskReminderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _interval = TimeSpan.FromHours(1); // Check every hour

        public TaskReminderService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var emailService = scope.ServiceProvider.GetRequiredService<EmailService>();
                    var userManager = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<ApplicationUser>>();
                    var now = DateTime.UtcNow;
                    var soon = now.AddDays(2);
                    var tasks = await db.Tasks
                        .Where(t => t.Status != "Done" && t.DueDate <= soon)
                        .ToListAsync();
                    foreach (var task in tasks)
                    {
                        var user = await userManager.FindByIdAsync(task.AssignedToId);
                        if (user != null && !string.IsNullOrEmpty(user.Email))
                        {
                            string subject, body;
                            if (task.DueDate < now)
                            {
                                subject = "Task Overdue";
                                body = $"Your task '{task.Title}' is overdue! Please update its status.";
                            }
                            else
                            {
                                subject = "Task Deadline Approaching";
                                body = $"Your task '{task.Title}' is due on {task.DueDate:d}. Please ensure it is completed on time.";
                            }
                            await emailService.SendEmailAsync(user.Email, subject, body);
                        }
                    }
                }
                await Task.Delay(_interval, stoppingToken);
            }
        }
    }
} 