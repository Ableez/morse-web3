import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div
      className={
        "flex align-middle place-items-center justify-center w-screen h-screen"
      }
    >
      <SignIn />
    </div>
  );
}
