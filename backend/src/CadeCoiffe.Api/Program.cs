using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using CadeCoiffe.Api.Data;
using CadeCoiffe.Api.Endpoints;
using CadeCoiffe.Api.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key manquant dans la configuration");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddOpenApi();

// Enregistrer l'encoding windows-1252 pour l'export Winbiz
Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseAuthentication();
app.UseAuthorization();

// Migrations automatiques + seed super admin
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    var adminEmail = app.Configuration["Admin:Email"];
    var adminPassword = app.Configuration["Admin:Password"];
    if (!string.IsNullOrEmpty(adminEmail) && !string.IsNullOrEmpty(adminPassword))
    {
        var hasAdmin = await db.Users.AnyAsync(u => u.IsSuperAdmin);
        if (!hasAdmin)
        {
            db.Users.Add(new User
            {
                Email = adminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                IsSuperAdmin = true,
            });
            await db.SaveChangesAsync();
        }
    }
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Endpoints
app.MapAuthEndpoints();
app.MapCatalogueEndpoints();
app.MapEncaissementEndpoints();
app.MapExportEndpoints();
app.MapAdminEndpoints();
app.MapTenantEndpoints();

app.Run();
