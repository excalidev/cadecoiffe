using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using CadeCoiffe.Api.Data;

namespace CadeCoiffe.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/login", async (LoginRequest req, AppDbContext db, IConfiguration config) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
            if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Results.Unauthorized();

            var token = GenerateToken(user, config["Jwt:Key"]!);
            return Results.Ok(new { token, user = new { user.Id, user.Email, user.TenantId, user.IsSuperAdmin } });
        });
    }

    private static string GenerateToken(Models.User user, string key)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new("tenant_id", user.TenantId?.ToString() ?? ""),
            new("is_super_admin", user.IsSuperAdmin.ToString().ToLower()),
        };

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public record LoginRequest(string Email, string Password);
}
