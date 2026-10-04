using System;
using System.Globalization;
using System.Runtime.InteropServices;
public static class WindowsVariantOracle {
  const string DLL="oleaut32.dll";
  [DllImport(DLL)] static extern int VariantClear(IntPtr p);
  [DllImport(DLL)] static extern int VariantChangeTypeEx(IntPtr result,IntPtr input,int lcid,ushort flags,ushort type);
  [DllImport(DLL)] static extern int VarAdd(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarSub(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarMul(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarDiv(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarIdiv(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarMod(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarPow(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarAnd(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarOr(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarXor(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarEqv(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarImp(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarCat(IntPtr a,IntPtr b,IntPtr r);
  [DllImport(DLL)] static extern int VarCmp(IntPtr a,IntPtr b,int lcid,uint flags);
  [DllImport("kernel32.dll",SetLastError=true)] static extern int WideCharToMultiByte(uint cp,uint flags,[MarshalAs(UnmanagedType.LPWStr)] string text,int length,byte[] bytes,int count,IntPtr replacement,out bool usedDefault);
  [DllImport("kernel32.dll",SetLastError=true)] static extern int MultiByteToWideChar(uint cp,uint flags,byte[] bytes,int length,[Out] char[] text,int count);
  static readonly CultureInfo Inv=CultureInfo.InvariantCulture;
  public class Result {public int type; public string value; public int hresult;}
  static IntPtr Allocate(){IntPtr p=Marshal.AllocCoTaskMem(32);for(int i=0;i<32;i++)Marshal.WriteByte(p,i,0);return p;}
  static object Parse(int type,string value){switch(type){
    case 0:return null;case 1:return DBNull.Value;case 2:return short.Parse(value,Inv);case 3:return int.Parse(value,Inv);case 4:return float.Parse(value,Inv);case 5:return double.Parse(value,Inv);case 6:return new CurrencyWrapper(decimal.Parse(value,Inv));case 7:return DateTime.FromOADate(double.Parse(value,Inv));case 8:return value;case 10:return new ErrorWrapper(int.Parse(value,Inv));case 11:return value!="0";case 14:return decimal.Parse(value,NumberStyles.Float,Inv);case 17:return byte.Parse(value,Inv);default:throw new ArgumentException("type");}}
  public static Result Run(string op,int ta,string va,int tb,string vb,int lcid=1033){
    IntPtr a=Allocate(),b=Allocate(),r=Allocate();
    try{
      Marshal.GetNativeVariantForObject(Parse(ta,va),a);Marshal.GetNativeVariantForObject(Parse(tb,vb),b);int hr;
      switch(op){
        case "+":hr=VarAdd(a,b,r);break;case "-":hr=VarSub(a,b,r);break;case "*":hr=VarMul(a,b,r);break;case "/":hr=VarDiv(a,b,r);break;
        case "\\":hr=VarIdiv(a,b,r);break;case "mod":hr=VarMod(a,b,r);break;case "^":hr=VarPow(a,b,r);break;case "and":hr=VarAnd(a,b,r);break;case "or":hr=VarOr(a,b,r);break;case "xor":hr=VarXor(a,b,r);break;case "eqv":hr=VarEqv(a,b,r);break;case "imp":hr=VarImp(a,b,r);break;case "&":hr=VarCat(a,b,r);break;
        case "cmp":hr=VarCmp(a,b,lcid,0);return new Result{hresult=hr<0?hr:0,type=hr==3?1:2,value=hr<0?null:(hr-1).ToString(Inv)};
        case "convert":hr=VariantChangeTypeEx(r,a,lcid,0,(ushort)tb);break;
        default:throw new ArgumentException("op");
      }
      if(hr<0)return new Result{hresult=hr};int type=Marshal.ReadInt16(r);object result=Marshal.GetObjectForNativeVariant(r);
      string value=type==0?"Empty":type==1?"Null":type==11?((bool)result?"-1":"0"):type==7?((DateTime)result).ToOADate().ToString("R",Inv):type==4?((float)result).ToString("R",Inv):type==5?((double)result).ToString("R",Inv):Convert.ToString(result,Inv);
      return new Result{type=type,value=value,hresult=hr};
    }finally{VariantClear(a);VariantClear(b);VariantClear(r);Marshal.FreeCoTaskMem(a);Marshal.FreeCoTaskMem(b);Marshal.FreeCoTaskMem(r);}
  }
  public static string Encode(int cp,string text){bool used;int n=WideCharToMultiByte((uint)cp,cp==65001?0u:0x400u,text,text.Length,null,0,IntPtr.Zero,out used);if(n==0||used)throw new InvalidOperationException("Unmappable string: "+Marshal.GetLastWin32Error());byte[] bytes=new byte[n];if(WideCharToMultiByte((uint)cp,cp==65001?0u:0x400u,text,text.Length,bytes,n,IntPtr.Zero,out used)!=n||used)throw new InvalidOperationException("Encoding failed");return BitConverter.ToString(bytes).Replace("-","").ToLowerInvariant();}
  public static string Decode(int cp,string hex){byte[] bytes=new byte[hex.Length/2];for(int i=0;i<bytes.Length;i++)bytes[i]=byte.Parse(hex.Substring(i*2,2),NumberStyles.HexNumber);int n=MultiByteToWideChar((uint)cp,8,bytes,bytes.Length,null,0);if(n==0)throw new InvalidOperationException("Invalid sequence");char[] chars=new char[n];if(MultiByteToWideChar((uint)cp,8,bytes,bytes.Length,chars,n)!=n)throw new InvalidOperationException("Decoding failed");return new string(chars);}
}
