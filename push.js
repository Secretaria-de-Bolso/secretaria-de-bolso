const VAPID_PUBLIC="BJTs92Dy1WoUpGHN_evm-CxoTF72VFYPw4icitZZ8xzAZ95qO-lxZhBOD4_umq-5c81VXvCX4GagbSDoT8AVE0Y";

async function registrarPush(){
  try{
    if(!("Notification" in window)||!("serviceWorker" in navigator))return;
    if(Notification.permission!=="granted")return;
    const reg=await navigator.serviceWorker.ready;
    const existing=await reg.pushManager.getSubscription();
    const sub=existing||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:VAPID_PUBLIC});
    const s=sub.toJSON();
    await sb.from("push_subscriptions").upsert({user_id:currentUser.id,endpoint:s.endpoint,p256dh:s.keys.p256dh,auth:s.keys.auth,subscription:JSON.stringify(s)},{onConflict:"user_id"});
  }catch(e){console.error("Push:",e)}
}
