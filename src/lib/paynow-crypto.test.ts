import { tripleDESEncrypt, tripleDESDecrypt } from './paynow-crypto';

describe('PayNow 3DES compatibility', () => {
  const sampleOrderJson = JSON.stringify({
    user_account: '28229955',
    apicode: '12345678',
    Logistic_service: '01',
    OrderNo: '211202114539',
    DeliverMode: '02',
    TotalAmount: '200',
    Remark: '',
    Description: 'test',
    receiver_storeid: '993041',
    receiver_storename: '松高門市',
    return_storeid: '',
    Receiver_Name: '收件測',
    Receiver_Phone: '0912345678',
    Receiver_Email: '123@paynow.com.tw',
    Receiver_address: '台北市信義區基隆路一段141號1樓',
    Sender_Name: '寄件測',
    Sender_Phone: '0900000000',
    Sender_Email: 'test@paynow.com.tw',
    Sender_address: '',
    PassCode: '02EC87F0331316C0BC5373F4BFD35FA52208B67B',
  });

  const samplePassword = '12345678'; // apiCode
  const expectedBase64 =
    'cHT6bDGmNZ2auJYYOJCu7MDnubZf2LOMB+CsoyNSSFMZ505Tp0gb+PrOZRgW8wZsebC0UPtm8hyJkUQbqY4CWiKpVv6/fnu62lGB87JiWJ1nAIz7R4aDwh52V0ikh3kE7pZZoxX2D8aaaMPNs4cS0rjun1EZoxkxBVaK7lSFroepchX0Y3RDfgXKu0IX9JhiVYpayewaVrfwMH5u78W1Eu91XWGoFGkUNiNa0g8WLv8W4GoY5cOTm0S8/vgV8WiH3lH4xnfO/61EuUsEE1oviypk2ncT8khwm0bx0WXdGPT6P6d2yYR6VD7ckmvfbqSrL2gfEqOlQn2sh7BvfqTl0xMaNfY0DPkMR6I/y4QG2A5VHgJR14O/BcKMfIFj5XeVmz59LT+itsBvVWLlZ3AnjktYdVMovdf6UkW7lx3lkKzzh83zQ4cfDYjI+nU9OffIk2ReAgpxOWKKQ0YoC3Shf+SDfzCHyWXuhNNKg/RvSaWvR0Pm3Zpcqmm77yBRDX/zEUDUjYfnoSgX2sGbxiiPPPpjjP4AzIV3+xCuxgCvbccV3rmhA+xrSlfBK39GCyJaolFG/ys/2we8fmGiPv9SEQEfN4ARz3io7UzOt3LFlPPVevGLG2v2JbKiaJdIELTwHmr4HpPNQ2PqxKiE4GasrWO4t+16qHw3UPKHMjnlY4bQIJ3mbe5odUH4O9hHZ8qoqq2B1d+LfMWIDvOqu2o1GwtiprVRwRah8ky2SKxntmYD7Wa86Je1x1WvApLh3iIO+fhMDwRZ8pJc=';

  it('matches PayNow official encryption output', () => {
    const encrypted = tripleDESEncrypt(sampleOrderJson, samplePassword);
    expect(encrypted).toBe(expectedBase64);
  });

  it('decrypts PayNow official sample back to JSON', () => {
    const decrypted = tripleDESDecrypt(expectedBase64, samplePassword);
    expect(decrypted).toBe(sampleOrderJson);
  });
});

