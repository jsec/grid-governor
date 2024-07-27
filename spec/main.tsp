import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;

@service({
  title: "Grid Governor API",
})
@server("https://grid-gov.placeholder", "Grid Governor")
namespace GridGov;
