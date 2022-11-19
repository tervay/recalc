import credsEnc from "creds.enc.json";
import AES from "crypto-js/aes";
import utf8Encoder from "crypto-js/enc-utf8";

type Credentials =
  | {
      email: string;
      private_key: string;
    }
  | undefined;

const keyphrase = import.meta.env.VITE_KEYPHRASE;
const credentials: Credentials =
  keyphrase === undefined
    ? undefined
    : JSON.parse(AES.decrypt(credsEnc.value, keyphrase).toString(utf8Encoder));

export default credentials;
