// Real Windows regression: a previous COM failure must not replace the next HRESULT.
using System;
using System.Linq;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;
namespace VB6Interop {
  public static partial class AutomationHost {
    public static string RunComOleErrorContracts() {
      var report=Map(Json.DeserializeObject(RunComOleContainerContracts()));
      var checks=A(report["checks"]).Select(item=>(string)item).ToList();
      Marshal.ThrowExceptionForHR(NativeOleInitialize(IntPtr.Zero));
      try {
        var source=new NativeOleDataObject();
        var format=new FORMATETC {cfFormat=13,dwAspect=DVASPECT.DVASPECT_CONTENT,lindex=-1,tymed=TYMED.TYMED_ISTREAM};
        var sink=new NativeDataChangeSink((f,m)=>{});int cookie;
        Marshal.ThrowExceptionForHR(source.DAdvise(ref format,(ADVF)1,sink,out cookie));
        try {
          Marshal.GetHRForException(new COMException("Unrelated prior provider",unchecked((int)0x80040068)));
          bool correct=false;
          try { source.DUnadvise(cookie+1); }
          catch(COMException error) { correct=error.ErrorCode==unchecked((int)0x80040004); }
          Require(correct,"stale IErrorInfo cannot replace advisory HRESULT");
          BeginBrowsingCall();
          var missing=format;missing.lindex=7;
          Require(source.QueryGetData(ref missing)==unchecked((int)0x80040064),"format query returns its exact HRESULT");
        } finally { BeginBrowsingCall();source.DUnadvise(cookie);source.Stop(); }
        checks.Add("advisory HRESULTs are independent of stale thread IErrorInfo");
      } finally { NativeOleUninitialize(); }
      report["checks"]=checks.ToArray();return Json.Serialize(report);
    }
  }
}
