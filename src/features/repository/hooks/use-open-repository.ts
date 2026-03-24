import { useMutation } from "@tanstack/react-query";

import { openRepository } from "../api/open-repository";

export function useOpenRepository() {
  return useMutation({
    mutationFn: openRepository,
  });
}
