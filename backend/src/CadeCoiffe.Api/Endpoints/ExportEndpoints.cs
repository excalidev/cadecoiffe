using System.Text;
using Microsoft.EntityFrameworkCore;
using CadeCoiffe.Api.Data;
using CadeCoiffe.Api.Models;

namespace CadeCoiffe.Api.Endpoints;

public static class ExportEndpoints
{
    public static void MapExportEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/exports").RequireAuthorization();

        group.MapGet("/pending", async (HttpContext ctx, AppDbContext db) =>
        {
            var tenantId = ctx.GetTenantId();
            var pending = await db.Encaissements
                .Where(e => e.TenantId == tenantId && !e.Exported)
                .OrderBy(e => e.Date).ThenBy(e => e.CreatedAt)
                .ToListAsync();
            return Results.Ok(pending);
        });

        group.MapPost("/", async (HttpContext ctx, AppDbContext db) =>
        {
            var tenantId = ctx.GetTenantId();
            var encaissements = await db.Encaissements
                .Where(e => e.TenantId == tenantId && !e.Exported)
                .OrderBy(e => e.Date).ThenBy(e => e.CreatedAt)
                .ToListAsync();

            if (encaissements.Count == 0)
                return Results.BadRequest("Aucun encaissement à exporter");

            var csv = BuildCsv(encaissements);
            var firstDate = encaissements.First().Date.Replace(".", "");
            var lastDate = encaissements.Last().Date.Replace(".", "");
            var filename = firstDate == lastDate
                ? $"winbiz_{firstDate}.csv"
                : $"winbiz_{firstDate}_{lastDate}.csv";

            var export = new Export
            {
                TenantId = tenantId,
                Filename = filename,
                CsvContent = csv,
                EncaissementCount = encaissements.Count,
                Total = encaissements.Sum(e => e.Montant),
            };
            db.Exports.Add(export);

            foreach (var enc in encaissements)
                enc.Exported = true;

            await db.SaveChangesAsync();
            return Results.Created($"/api/exports/{export.Id}", new
            {
                export.Id, export.Filename, export.EncaissementCount, export.Total, export.CreatedAt
            });
        });

        group.MapGet("/", async (HttpContext ctx, AppDbContext db) =>
        {
            var tenantId = ctx.GetTenantId();
            var exports = await db.Exports
                .Where(e => e.TenantId == tenantId)
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => new { e.Id, e.Filename, e.EncaissementCount, e.Total, e.CreatedAt })
                .ToListAsync();
            return Results.Ok(exports);
        });

        group.MapGet("/{id:guid}/download", async (Guid id, HttpContext ctx, AppDbContext db) =>
        {
            var tenantId = ctx.GetTenantId();
            var export = await db.Exports.FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);
            if (export is null) return Results.NotFound();

            var encoding = Encoding.GetEncoding("windows-1252");
            var bytes = encoding.GetBytes(export.CsvContent);
            return Results.File(bytes, "text/csv", export.Filename);
        });
    }

    private static string BuildCsv(List<Encaissement> encaissements)
    {
        var lines = new List<string> { "Date;N° Pièce;Cpte Débit;Cpte Crédit;Libellé;Montant;Journal" };
        for (int i = 0; i < encaissements.Count; i++)
        {
            var e = encaissements[i];
            lines.Add(string.Join(";", [
                e.Date,
                (i + 1).ToString(),
                e.CompteDebit,
                e.CompteCredit,
                e.Libelle.Replace(";", ","),
                e.Montant.ToString("F2"),
                e.Journal
            ]));
        }
        return string.Join("\r\n", lines);
    }
}
