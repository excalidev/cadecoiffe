using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using CadeCoiffe.Api.Data;
using CadeCoiffe.Api.Models;

namespace CadeCoiffe.Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin").RequireAuthorization();

        // Tenants
        group.MapGet("/tenants", async (HttpContext ctx, AppDbContext db) =>
        {
            ctx.RequireSuperAdmin();
            return Results.Ok(await db.Tenants.OrderBy(t => t.Name).ToListAsync());
        });

        group.MapPost("/tenants", async (HttpContext ctx, AppDbContext db, Tenant tenant) =>
        {
            ctx.RequireSuperAdmin();
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync();
            return Results.Created($"/api/admin/tenants/{tenant.Id}", tenant);
        });

        group.MapPut("/tenants/{id:guid}", async (Guid id, HttpContext ctx, AppDbContext db, Tenant updated) =>
        {
            ctx.RequireSuperAdmin();
            var tenant = await db.Tenants.FindAsync(id);
            if (tenant is null) return Results.NotFound();
            tenant.Name = updated.Name;
            tenant.CompteCaisse = updated.CompteCaisse;
            await db.SaveChangesAsync();
            return Results.Ok(tenant);
        });

        // Utilisateurs
        group.MapGet("/users", async (HttpContext ctx, AppDbContext db, Guid? tenantId) =>
        {
            ctx.RequireSuperAdmin();
            var query = db.Users.AsQueryable();
            if (tenantId.HasValue) query = query.Where(u => u.TenantId == tenantId);
            return Results.Ok(await query.Select(u => new { u.Id, u.Email, u.TenantId, u.IsSuperAdmin }).ToListAsync());
        });

        group.MapPost("/users", async (HttpContext ctx, AppDbContext db, CreateUserRequest req) =>
        {
            ctx.RequireSuperAdmin();
            if (await db.Users.AnyAsync(u => u.Email == req.Email))
                return Results.Conflict("Email déjà utilisé");
            var user = new User
            {
                Email = req.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                TenantId = req.TenantId,
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return Results.Created($"/api/admin/users/{user.Id}", new { user.Id, user.Email, user.TenantId });
        });

        // Import catalogue JSON
        group.MapPost("/tenants/{tenantId:guid}/import-catalogue", async (
            Guid tenantId, HttpContext ctx, AppDbContext db, CatalogueImport import) =>
        {
            ctx.RequireSuperAdmin();
            if (!await db.Tenants.AnyAsync(t => t.Id == tenantId))
                return Results.NotFound("Tenant introuvable");

            // Mettre à jour le compte caisse si fourni
            if (!string.IsNullOrEmpty(import.Tenant?.CompteCaisse))
            {
                var tenant = await db.Tenants.FindAsync(tenantId);
                if (tenant is not null) tenant.CompteCaisse = import.Tenant.CompteCaisse;
            }

            // Supprimer l'ancien catalogue
            var oldCategories = db.Categories.Where(c => c.TenantId == tenantId);
            db.Categories.RemoveRange(oldCategories);

            // Importer le nouveau catalogue
            int catOrder = 0;
            foreach (var catDto in import.Categories ?? [])
            {
                var category = new Category
                {
                    TenantId = tenantId,
                    Label = catDto.Label,
                    CompteCredit = catDto.CompteCredit ?? string.Empty,
                    Journal = catDto.Journal ?? string.Empty,
                    Order = catOrder++,
                };
                int svcOrder = 0;
                foreach (var svcDto in catDto.Services ?? [])
                {
                    var service = new Service
                    {
                        Code = svcDto.Code ?? string.Empty,
                        Name = svcDto.Name,
                        Subtitle = svcDto.Subtitle,
                        CompteCredit = svcDto.CompteCredit,
                        Journal = svcDto.Journal,
                        Order = svcOrder++,
                    };
                    if (svcDto.Variants?.Count > 0)
                    {
                        int varOrder = 0;
                        foreach (var varDto in svcDto.Variants)
                            service.Variants.Add(new Variant
                            {
                                Name = varDto.Name ?? string.Empty,
                                Price = varDto.Price,
                                Variable = varDto.Variable,
                                Code = varDto.Code,
                                CompteCredit = varDto.CompteCredit,
                                Journal = varDto.Journal,
                                Order = varOrder++,
                            });
                    }
                    else
                    {
                        service.Variants.Add(new Variant
                        {
                            Name = string.Empty,
                            Price = svcDto.Price,
                            Variable = svcDto.Variable,
                            Order = 0,
                        });
                    }
                    category.Services.Add(service);
                }
                db.Categories.Add(category);
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { imported = import.Categories?.Count ?? 0 });
        });
    }

    public record CreateUserRequest(string Email, string Password, Guid? TenantId);

    public record CatalogueImport(TenantConfig? Tenant, List<CategoryDto>? Categories);
    public record TenantConfig(string? CompteCaisse);
    public record CategoryDto(string Label, string? CompteCredit, string? Journal, List<ServiceDto>? Services);
    public record ServiceDto(
        string? Code, string Name, string? Subtitle,
        decimal? Price, bool Variable,
        string? CompteCredit, string? Journal,
        List<VariantDto>? Variants);
    public record VariantDto(
        string? Name, decimal? Price, bool Variable,
        string? Code, string? CompteCredit, string? Journal);
}
