// Real Windows regression: a previous COM failure must not replace the next HRESULT.
using System;
using System.Linq;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;
namespace VB6Interop {
  public static partial class AutomationHost {
    static object DataSequenceStep(System.Collections.Generic.Dictionary<string,object> request) {
      try { object result;Require(TryComOle(request,out result),"known OLE service operation");return result; }
      catch(Exception error) { throw new InvalidOperationException("OLE contract step "+S(request,"op"),error); }
    }
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
        var created=Map(DataSequenceStep(D("op","ole.dataCreate")));string handle=S(created,"id");
        try {
          var wire=D("cfFormat",13,"tymed",4);
          DataSequenceStep(D("op","ole.dataSet","handle",handle,"format",wire,"data","AQID"));
          var once=Map(DataSequenceStep(D("op","ole.dataAdvise","handle",handle,"format",wire,"flags",6)));
          DataSequenceStep(D("op","ole.dataChanges"));
          DataSequenceStep(D("op","ole.dataUnadvise","connection",once["connection"]));
          var again=Map(DataSequenceStep(D("op","ole.dataAdvise","handle",handle,"format",wire,"flags",1)));
          DataSequenceStep(D("op","ole.dataSet","handle",handle,"format",wire,"data","BAUG"));
          DataSequenceStep(D("op","ole.dataUnadvise","connection",again["connection"]));
          checks.Add("expired ONLYONCE connection permits subsequent advisory registration");
        } finally { BeginBrowsingCall();Release(handle); }
        DataSequenceStep(D("op","ole.dataChanges"));
      } finally { NativeOleUninitialize(); }
      report["checks"]=checks.ToArray();return Json.Serialize(report);
    }
  }
}
