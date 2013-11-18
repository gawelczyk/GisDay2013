using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;

namespace CoverageWebApp
{
    /// <summary>
    /// Summary description for Proxy
    /// </summary>
    public class Proxy : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            HttpResponse response = context.Response;
            if (isQueryStringLongerThanZero(context.Request.Url.Query))
            {
                string uri = context.Request.Url.Query.Substring(1);
                uri = HttpUtility.UrlDecode(uri);
                if (doesStartWithHttp(uri))
                {
                    HttpWebRequest req = CreateHttpWebRequest(uri, context.Request.HttpMethod);

                    if (isPostRequest(context.Request))
                        AddPostToRequest(context.Request, req);

                    ProcessProxyRequest(req, response);
                }
            }

            HttpContext.Current.ApplicationInstance.CompleteRequest();
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }

        private bool isQueryStringLongerThanZero(string p)
        {
            return p.Length > 0;
        }

        private bool doesStartWithHttp(string uri)
        {
            return uri.StartsWith("http://", StringComparison.InvariantCultureIgnoreCase) || uri.StartsWith("https://", StringComparison.InvariantCultureIgnoreCase);
        }

        private HttpWebRequest CreateHttpWebRequest(string uri, string method)
        {
            var req = (HttpWebRequest)System.Net.WebRequest.Create(uri);
            req.Method = method;
            req.ServicePoint.Expect100Continue = false;
            return req;
        }

        private bool isPostRequest(HttpRequest req)
        {
            return req.InputStream.Length > 0;
        }

        private void AddPostToRequest(HttpRequest orgReq, HttpWebRequest req)
        {
            try
            {
                var bytes = new byte[orgReq.InputStream.Length];
                orgReq.InputStream.Read(bytes, 0, (int)orgReq.InputStream.Length);
                req.ContentLength = bytes.Length;

                string ctype = orgReq.ContentType;
                if (String.IsNullOrEmpty(ctype))
                {
                    req.ContentType = "application/x-www-form-urlencoded";
                }
                else
                {
                    req.ContentType = ctype;
                }
                using (Stream outputStream = req.GetRequestStream())
                {
                    outputStream.Write(bytes, 0, bytes.Length);
                }
            }
            catch (Exception ex)
            {
                Debug.Print(ex.Message);
            }
        }

        private void ProcessProxyRequest(HttpWebRequest req, HttpResponse response)
        {
            System.Net.WebResponse serverResponse = null;

            // Send the request to the server
            serverResponse = GetResponse(req, response);

            // Set up the response to the client
            if (serverResponse != null)
            {
                response.ContentType = serverResponse.ContentType;
                using (Stream byteStream = serverResponse.GetResponseStream())
                {

                    // Text response
                    if (serverResponse.ContentType.Contains("text") ||
                        serverResponse.ContentType.Contains("json"))
                    {
                        using (StreamReader sr = new StreamReader(byteStream))
                        {
                            string strResponse = sr.ReadToEnd();
                            response.Write(strResponse);
                        }
                    }
                    else
                    {
                        // Binary response (image, lyr file, other binary file)
                        BinaryReader br = new BinaryReader(byteStream);
                        byte[] outb = br.ReadBytes((int)serverResponse.ContentLength);
                        br.Close();

                        // Tell client not to cache the image since it's dynamic
                        response.CacheControl = "no-cache";

                        // Send the image to the client
                        // (Note: if large images/files sent, could modify this to send in chunks)
                        response.OutputStream.Write(outb, 0, outb.Length);
                    }
                    serverResponse.Close();
                }
            }
        }

        private WebResponse GetResponse(HttpWebRequest req, HttpResponse response)
        {
            WebResponse serverResponse = null;
            try
            {
                serverResponse = req.GetResponse();
            }
            catch (System.Net.WebException webExc)
            {
                response.StatusCode = 530;
                var r = webExc.Response as HttpWebResponse;
                if (r != null)
                {
                    Debug.WriteLine(r.StatusCode);
                    response.StatusCode = (int)r.StatusCode;
                }
                response.StatusDescription = webExc.Status.ToString();
                RewriteResponse(response, webExc.Response);
                //response.Write(webExc.Response.GetResponseStream());
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
                response.StatusCode = 531;
                response.StatusDescription = ex.Message;
            }
            return serverResponse;
        }

        private void RewriteResponse(HttpResponse dest, WebResponse webResponse)
        {
            if (webResponse != null)
            {
                dest.ContentType = webResponse.ContentType;
                using (Stream byteStream = webResponse.GetResponseStream())
                {
                    // Text response
                    if (webResponse.ContentType.Contains("text") ||
                        webResponse.ContentType.Contains("json"))
                    {
                        using (StreamReader sr = new StreamReader(byteStream))
                        {
                            string strResponse = sr.ReadToEnd();
                            dest.Write(strResponse);
                        }
                    }
                    else
                    {
                        // Binary response (image, lyr file, other binary file)
                        BinaryReader br = new BinaryReader(byteStream);
                        byte[] outb = br.ReadBytes((int)webResponse.ContentLength);
                        br.Close();

                        // Tell client not to cache the image since it's dynamic
                        dest.CacheControl = "no-cache";
                        // Send the image to the client
                        // (Note: if large images/files sent, could modify this to send in chunks)
                        dest.OutputStream.Write(outb, 0, outb.Length);
                    }
                    webResponse.Close();
                }
            }
        }
    }
}