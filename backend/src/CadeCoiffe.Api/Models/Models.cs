namespace CadeCoiffe.Api.Models;

public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string CompteCaisse { get; set; } = "1010";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public Guid? TenantId { get; set; }
    public bool IsSuperAdmin { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string CompteCredit { get; set; } = string.Empty;
    public string Journal { get; set; } = string.Empty;
    public int Order { get; set; }
    public List<Service> Services { get; set; } = [];
}

public class Service
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CategoryId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? CompteCredit { get; set; }
    public string? Journal { get; set; }
    public int Order { get; set; }
    public List<Variant> Variants { get; set; } = [];
}

public class Variant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ServiceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public bool Variable { get; set; }
    public string? Code { get; set; }
    public string? CompteCredit { get; set; }
    public string? Journal { get; set; }
    public int Order { get; set; }
}

public class Encaissement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Date { get; set; } = string.Empty; // dd.MM.yyyy
    public string Libelle { get; set; } = string.Empty;
    public decimal Montant { get; set; }
    public string CompteDebit { get; set; } = string.Empty;
    public string CompteCredit { get; set; } = string.Empty;
    public string Journal { get; set; } = string.Empty;
    public bool Exported { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Export
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Filename { get; set; } = string.Empty;
    public string CsvContent { get; set; } = string.Empty;
    public int EncaissementCount { get; set; }
    public decimal Total { get; set; }
}
