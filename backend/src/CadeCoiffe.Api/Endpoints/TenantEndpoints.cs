using Microsoft.EntityFrameworkCore;
using CadeCoiffe.Api.Data;

namespace CadeCoiffe.Api.Endpoints;

public static class TenantEndpoints
{
    public static void MapTenantEndpoints(this WebApplication app)
    {
        // Retourne le tenant de l'utilisateur connecté
        app.MapGet("/api/tenant", async (HttpContext ctx, AppDbContext db) =>
        {
            var claim = ctx.User.FindFirst("tenant_id")?.Value;
            if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var tenantId))
                return Results.NotFound();
            var tenant = await db.Tenants.FindAsync(tenantId);
            return tenant is null ? Results.NotFound() : Results.Ok(tenant);
        }).RequireAuthorization();
    }
}
