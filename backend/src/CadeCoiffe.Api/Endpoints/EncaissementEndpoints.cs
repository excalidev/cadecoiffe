using Microsoft.EntityFrameworkCore;
using CadeCoiffe.Api.Data;
using CadeCoiffe.Api.Models;

namespace CadeCoiffe.Api.Endpoints;

public static class EncaissementEndpoints
{
    public static void MapEncaissementEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/encaissements").RequireAuthorization();

        group.MapGet("/", async (HttpContext ctx, AppDbContext db, string? date) =>
        {
            var tenantId = ctx.GetTenantId();
            var query = db.Encaissements.Where(e => e.TenantId == tenantId);
            if (date is not null)
                query = query.Where(e => e.Date == date);
            return Results.Ok(await query.OrderBy(e => e.CreatedAt).ToListAsync());
        });

        group.MapPost("/", async (HttpContext ctx, AppDbContext db, EncaissementRequest req) =>
        {
            var tenantId = ctx.GetTenantId();
            var enc = new Encaissement
            {
                TenantId = tenantId,
                Date = req.Date,
                Libelle = req.Libelle,
                Montant = req.Montant,
                CompteDebit = req.CompteDebit,
                CompteCredit = req.CompteCredit,
                Journal = req.Journal,
            };
            db.Encaissements.Add(enc);
            await db.SaveChangesAsync();
            return Results.Created($"/api/encaissements/{enc.Id}", enc);
        });

        group.MapDelete("/{id:guid}", async (Guid id, HttpContext ctx, AppDbContext db) =>
        {
            var tenantId = ctx.GetTenantId();
            var enc = await db.Encaissements.FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);
            if (enc is null) return Results.NotFound();
            if (enc.Exported) return Results.BadRequest("Encaissement déjà exporté");
            db.Encaissements.Remove(enc);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }

    public record EncaissementRequest(
        string Date,
        string Libelle,
        decimal Montant,
        string CompteDebit,
        string CompteCredit,
        string Journal);
}
