import "./styles.css";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { useEffect, useState } from "react";

const web3Modal = new Web3Modal({
  network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {} // required
});

const requestSign = async (address: string, category: number) => {
  const header = new Headers();
  header.append("accept", "application/json, text/plain, */*");
  header.append("accept-language", "zh-CN,zh;q=0.9,en;q=0.8");
  header.append("cache-control", "no-cache");
  header.append("content-type", "application/json");

  const raw = JSON.stringify({
    address: address,
    category
  });

  const requestOptions = {
    method: "POST",
    headers: header,
    body: raw,
    redirect: "follow"
  };

  return fetch(
    "https://us-central1-ldr-prod.cloudfunctions.net/api/sign",
    //@ts-ignore
    requestOptions
  )
    .then((response) => response.json())
    .catch((error) => console.log("error", error));
};

export default function App() {
  const [instance, setInstance] = useState(null);
  const [
    provider,
    setProvider
  ] = useState<ethers.providers.Web3Provider | null>(null);
  const [running, setRunning] = useState(false);

  const onConnection = async () => {
    if (instance) return;
    const i = await web3Modal.connect();
    setInstance(i);
  };

  useEffect(() => {
    if (!instance) return;
    setProvider(new ethers.providers.Web3Provider(instance));
  }, [instance]);

  const claimAll = async () => {
    if (!provider) return;
    const contract = new ethers.Contract(
      "0xFD43D1dA000558473822302e1d44D81dA2e4cC0d",
      ["function mint ( uint256 _category, bytes _data, bytes _signature )"],
      provider.getSigner()
    );
    const address = await provider.getSigner().getAddress();
    for (let i = 1; i <= 9; i++) {
      const signature = await requestSign(address, i);
      await contract
        .mint(i, signature["v"], signature["signature"])
        .catch(() => {});
      console.log(`Success mint #${i}`);
    }
  };

  const claimAllWrapper = async () => {
    try {
      setRunning(true);
      await claimAll();
    } catch (e) {
      console.error(e);
    }
    setRunning(false);
  };

  return (
    <div className="App">
      <h1>
        LDR NFT一键FreeMint 脚本制作人：BOX，推特：https://twitter.com/BoxMrChen
      </h1>
      <h2>
        如果使用中出现，连接钱包无反应，无法切换钱包，或者其他问题，可以尝试使用生产部署版本：
        <a
          href="https://csb-lmeudq.netlify.app/"
          target="_blank"
          rel="noreferrer"
        >
          Netlify版
        </a>
      </h2>
      <h2>
        If you have problems connecting to your wallet, not responding, not
        being able to switch wallets, or other problems, you can try using the
        production deployment version:
        <a
          href="https://csb-lmeudq.netlify.app/"
          target="_blank"
          rel="noreferrer"
        >
          Netlify version
        </a>
      </h2>
      {instance ? (
        <>
          {/* @ts-ignore */}
          <p>当前地址:{instance.selectedAddress}</p>
          <button onClick={claimAllWrapper} disabled={running}>
            领取全部LDR NFT
          </button>
        </>
      ) : (
        <>
          <p>
            请确保使用ETH主网
            <br />
            Please make sure to use the ETH main network
          </p>
          <button onClick={onConnection}>Connection wallet</button>
        </>
      )}
    </div>
  );
}
