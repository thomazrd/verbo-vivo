
interface WelcomeHeaderProps {
    userName: string;
}

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
        Olá, {userName}!
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Que a paz de Cristo esteja com você neste dia.
      </p>
    </div>
  );
}
