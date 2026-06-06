import { getCompanyFromANAF, searchCompany } from "./src/anaf.js";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage:");
  console.log("  node demoanaf.js <CIF>           — Get company details by CIF");
  console.log("  node demoanaf.js search <brand>   — Search companies by brand");
  process.exit(1);
}

if (args[0] === "search") {
  const brand = args.slice(1).join(" ");
  const results = await searchCompany(brand);
  if (results.length === 0) {
    console.log(`No companies found for "${brand}"`);
  } else {
    console.log(`Results for "${brand}":`);
    results.forEach(c => {
      console.log(`  ${c.name} | CIF: ${c.cui} | Status: ${c.statusLabel}`);
    });
  }
} else {
  const cif = args[0];
  const data = await getCompanyFromANAF(cif);
  if (data) {
    console.log("Company:", data.name);
    console.log("CIF:", data.cui);
    console.log("Status:", data.inactive ? "INACTIVE" : "ACTIVE");
    console.log("Address:", data.address);
    console.log("Registration:", data.registrationNumber);
    console.log("CAEN:", data.caenCode);
    console.log("VAT:", data.vatRegistered);
    console.log("eFactura:", data.eFacturaRegistered);
  }
}
