import { useState } from "react";
import { useGuardian } from "./GuardianContext";

export function useRefresh() {
  const { refresh } = useGuardian();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };
  return { refreshing, onRefresh };
}
