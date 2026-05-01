using CadeCoiffe.Api.Models;

namespace CadeCoiffe.Api.Services;

/// <summary>
/// Résout les valeurs comptables (compteDebit, compteCredit, journal) par héritage :
/// variante → service → catégorie → tenant (pour compteDebit uniquement)
/// </summary>
public static class AccountingResolver
{
    public record AccountingValues(string CompteDebit, string CompteCredit, string Journal);

    public static AccountingValues Resolve(
        Tenant tenant,
        Category category,
        Service service,
        Variant? variant = null)
    {
        var compteDebit = tenant.CompteCaisse;
        var compteCredit = variant?.CompteCredit ?? service.CompteCredit ?? category.CompteCredit;
        var journal = variant?.Journal ?? service.Journal ?? category.Journal;
        return new AccountingValues(compteDebit, compteCredit, journal);
    }
}
