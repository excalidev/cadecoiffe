using Microsoft.EntityFrameworkCore;
using CadeCoiffe.Api.Models;

namespace CadeCoiffe.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Variant> Variants => Set<Variant>();
    public DbSet<Encaissement> Encaissements => Set<Encaissement>();
    public DbSet<Export> Exports => Set<Export>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Name).IsRequired();
            e.Property(t => t.CompteCaisse).IsRequired();
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).IsRequired();
            e.Property(u => u.PasswordHash).IsRequired();
        });

        modelBuilder.Entity<Category>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Label).IsRequired();
            e.Property(c => c.CompteCredit).IsRequired();
            e.Property(c => c.Journal).IsRequired();
            e.HasOne<Tenant>().WithMany().HasForeignKey(c => c.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Service>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.Name).IsRequired();
            e.HasOne<Category>().WithMany(c => c.Services).HasForeignKey(s => s.CategoryId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Variant>(e =>
        {
            e.HasKey(v => v.Id);
            e.Property(v => v.Name).IsRequired();
            e.HasOne<Service>().WithMany(s => s.Variants).HasForeignKey(v => v.ServiceId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Encaissement>(e =>
        {
            e.HasKey(enc => enc.Id);
            e.Property(enc => enc.Libelle).IsRequired();
            e.HasOne<Tenant>().WithMany().HasForeignKey(enc => enc.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Export>(e =>
        {
            e.HasKey(exp => exp.Id);
            e.Property(exp => exp.Filename).IsRequired();
            e.Property(exp => exp.CsvContent).IsRequired();
            e.HasOne<Tenant>().WithMany().HasForeignKey(exp => exp.TenantId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
