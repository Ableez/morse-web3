import { pinata } from "../../../../../../utils/pinata";

export const GET = async (request, { params }) => {
  try {
    const cid = params.cid;

    console.log("CID", cid);

    const url = await pinata.gateways.createSignedURL({
      cid: cid,
      expires: 60 * 60 * 1, // 1 HOUR
    });

    console.log("URL", url);
    return NextResponse.json({ url: url });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
