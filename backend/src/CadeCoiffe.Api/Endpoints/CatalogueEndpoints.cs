using Microsoft.EntityFrameworkCore;
using CadeCoiffe.Api.Data;
using CadeCoiffe.Api.Models;

namespace CadeCoiffe.Api.Endpoints;

public static class CatalogueEndpoints
{
    public static void MapCatalogueEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/catalogue").RequireAuthorization();

        group.MapGet("/", async (HttpContext ctx, AppDbContext db) =>
        {
            var tenantId = ctx.GetTenantId();
            var categories = await db.Categories
                .Where(c => c.TenantId == tenantId)
                .Include(c => c.Services.OrderBy(s => s.Order))
                .ThenInclude(s => s.Variants.OrderBy(v => v.Order))
                .OrderBy(c => c.Order)
                .ToListAsync();
            return Results.Ok(categories);
        });

        group.MapPost("/categories", async (HttpContext ctx, AppDbContext db, Category category) =>
        {
            category.TenantId = ctx.GetTenantId();
            db.Categories.Add(category);
            await db.SaveChangesAsync();
            return Results.Created($"/api/catalogue/categories/{category.Id}", category);
        });

        group.MapPut("/categories/{id:guid}", async (Guid id, HttpContext ctx, AppDbContext db, Category updated) =>
        {
            var tenantId = ctx.GetTenantId();
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
            if (category is null) return Results.NotFound();
            category.Label = updated.Label;
            category.CompteCredit = updated.CompteCredit;
            category.Journal = updated.Journal;
            category.Order = updated.Order;
            await db.SaveChangesAsync();
            return Results.Ok(category);
        });

        group.MapDelete("/categories/{id:guid}", async (Guid id, HttpContext ctx, AppDbContext db) =>
        {
            var tenantId = ctx.GetTenantId();
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
            if (category is null) return Results.NotFound();
            db.Categories.Remove(category);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapPost("/services", async (HttpContext ctx, AppDbContext db, Service service) =>
        {
            var tenantId = ctx.GetTenantId();
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == service.CategoryId && c.TenantId == tenantId);
            if (category is null) return Results.NotFound();
            db.Services.Add(service);
            await db.SaveChangesAsync();
            return Results.Created($"/api/catalogue/services/{service.Id}", service);
        });

        group.MapPut("/services/{id:guid}", async (Guid id, HttpContext ctx, AppDbContext db, Service updated) =>
        {
            var tenantId = ctx.GetTenantId();
            var service = await db.Services
                .Include(s => s.Variants)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (service is null) return Results.NotFound();
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == service.CategoryId && c.TenantId == tenantId);
            if (category is null) return Results.Forbid();
            service.Code = updated.Code;
            service.Name = updated.Name;
            service.Subtitle = updated.Subtitle;
            service.CompteCredit = updated.CompteCredit;
            service.Journal = updated.Journal;
            service.Order = updated.Order;
            await db.SaveChangesAsync();
            return Results.Ok(service);
        });

        group.MapDelete("/services/{id:guid}", async (Guid id, HttpContext ctx, AppDbContext db) =>
        {
            var tenantId = ctx.GetTenantId();
            var service = await db.Services.FirstOrDefaultAsync(s => s.Id == id);
            if (service is null) return Results.NotFound();
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == service.CategoryId && c.TenantId == tenantId);
            if (category is null) return Results.Forbid();
            db.Services.Remove(service);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
        group.MapPost("/services/{serviceId:guid}/variants", async (Guid serviceId, HttpContext ctx, AppDbContext db, Variant variant) =>
        {
            var tenantId = ctx.GetTenantId();
            var service = await db.Services.FirstOrDefaultAsync(s => s.Id == serviceId);
            if (service is null) return Results.NotFound();
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == service.CategoryId && c.TenantId == tenantId);
            if (category is null) return Results.Forbid();
            variant.ServiceId = serviceId;
            db.Variants.Add(variant);
            await db.SaveChangesAsync();
            return Results.Created($"/api/catalogue/variants/{variant.Id}", variant);
        });

        group.MapPut("/variants/{id:guid}", async (Guid id, HttpContext ctx, AppDbContext db, Variant updated) =>
        {
            var tenantId = ctx.GetTenantId();
            var variant = await db.Variants.FirstOrDefaultAsync(v => v.Id == id);
            if (variant is null) return Results.NotFound();
            var service = await db.Services.FirstOrDefaultAsync(s => s.Id == variant.ServiceId);
            if (service is null) return Results.NotFound();
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == service.CategoryId && c.TenantId == tenantId);
            if (category is null) return Results.Forbid();
            variant.Name = updated.Name;
            variant.Price = updated.Price;
            variant.Variable = updated.Variable;
            variant.Code = updated.Code;
            variant.CompteCredit = updated.CompteCredit;
            variant.Journal = updated.Journal;
            variant.Order = updated.Order;
            await db.SaveChangesAsync();
            return Results.Ok(variant);
        });

        group.MapDelete("/variants/{id:guid}", async (Guid id, HttpContext ctx, AppDbContext db) =>
        {
            var tenantId = ctx.GetTenantId();
            var variant = await db.Variants.FirstOrDefaultAsync(v => v.Id == id);
            if (variant is null) return Results.NotFound();
            var service = await db.Services.FirstOrDefaultAsync(s => s.Id == variant.ServiceId);
            if (service is null) return Results.NotFound();
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == service.CategoryId && c.TenantId == tenantId);
            if (category is null) return Results.Forbid();
            db.Variants.Remove(variant);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
