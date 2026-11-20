import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function base(props: IconProps) {
  const { title, ...rest } = props;
  return { title, rest };
}

export function IconShare(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" width="1.25em" height="1.25em" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"
      />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" width="1.25em" height="1.25em" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

export function IconPersonAdd(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" width="1.25em" height="1.25em" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
      />
    </svg>
  );
}

export function IconLink(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
      />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  const { title, rest } = base(props);
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden={title ? undefined : true} {...rest}>
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}
