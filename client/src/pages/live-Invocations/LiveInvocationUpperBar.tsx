import { PlayArrow } from "@mui/icons-material";
import { TextField, Tooltip } from "@mui/material";
import queryString from "query-string";
import { useState } from "react";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { useLocation, useNavigate } from "react-router-dom";
import { BackendAxios } from "../../api/backendAxios";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useSniffersStore } from "../../stores/sniffersStores";
import { getSnifferDomain } from "../../utils/getSnifferUrl";
import { SelectMethodDropDown } from "../mocks/SelectMethodDropDown";
import { InvocationDetails } from "../sniffers/InvocationDetails";
import { LoadingIcon } from "../sniffers/LoadingIcon";
import { InvocationType } from "../sniffers/types";

type InvocationSectionProps = {
  setEditedInvocation: React.Dispatch<
    React.SetStateAction<InvocationType | undefined>
  >;
  invocation?: InvocationType | undefined;
  isDisabled?: boolean;
};

export const InvocationSection = ({
  invocation,
  setEditedInvocation,
  isDisabled = true,
}: InvocationSectionProps) => {
  return (
    <div>
      <InvocationURL
        invocation={invocation}
        setEditedInvocation={setEditedInvocation}
        isDisabled={isDisabled}
      />
      <InvocationDetails
        invocation={invocation}
        setInvocation={setEditedInvocation}
      />
    </div>
  );
};

const InvocationURL: React.FC<InvocationSectionProps> = ({
  invocation,
  setEditedInvocation,
  isDisabled,
}) => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { snifferId } = queryString.parse(location.search);
  const { executeInvocation, loadingExecution } = useSniffersStore();
  const { sniffers } = useSniffersStore();
  const { show, component } = useSnackbar();
  const sniffer = sniffers.find(
    (s) => s.id === snifferId || s.id === invocation?.snifferId,
  );
  const navigator = useNavigate();

  const executeRequest = () => {
    if (!invocation) {
      return;
    }
    const sid = (snifferId as string) || invocation.snifferId;
    if (!sid) {
      return;
    }
    executeInvocation({ ...invocation, snifferId: sid }).then((res) => {
      if (res) {
        setEditedInvocation((prevState) => {
          if (prevState) {
            return {
              ...prevState,
              response: {
                ...prevState.response,
                status: res?.status || "",
                headers: res?.headers || {},
                body: res?.body || "",
              },
            };
          }
        });
      }
    });
  };

  const importMock = () => {
    if (!sniffer || !invocation || !invocation.response) {
      return;
    }
    setLoading(true);
    return BackendAxios.post("/mocks/import-from-invocation", {
      requestId: invocation.id,
    })
      .then((res) => {
        navigator(`/mocks/${res?.data?.id}?snifferId=${sniffer.id}`);
      })
      .catch(() => {
        show("Failed to import mock", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const snifferUrl = sniffer == null ? "" : getSnifferDomain(sniffer.subdomain);

  return (
    <div className="flex flex-row items-center space-x-2">
      {component}
      <div className="flex flex-row items-center w-28">
        <SelectMethodDropDown
          disabled={isDisabled}
          value={invocation?.method || ""}
          onChange={(value: string) => {
            if (invocation) {
              setEditedInvocation({
                ...invocation,
                method: value,
              });
            }
          }}
        />
      </div>
      <div className="flex flex-row items-center w-[550px]">
        <TextField
          disabled={true}
          value={snifferUrl}
          variant="outlined"
          size="small"
          style={{ width: "100%" }}
        />
      </div>
      <TextField
        disabled={isDisabled}
        value={invocation?.url}
        onChange={(e: any) => {
          if (invocation) {
            setEditedInvocation({
              ...invocation,
              url: e.target.value,
            });
          }
        }}
        variant="outlined"
        size="small"
        style={{ width: "100%" }}
      />
      <div className="flex flex-row items-center justify-between h-full">
        <div className="flex flex-row items-center min-w-[24px] w-[24px] h-full">
          <Tooltip title="Mock Request">
            <div onClick={importMock}>
              {loading ? (
                <LoadingIcon />
              ) : (
                <HiOutlineClipboardDocumentList className="text-yellow-500 cursor-pointer" />
              )}
            </div>
          </Tooltip>
        </div>
        <div className="flex flex-row items-center min-w-[24px] w-[24px] h-full">
          <Tooltip title="Execute Request">
            <div>
              {loadingExecution ? (
                <LoadingIcon />
              ) : (
                <PlayArrow
                  className="text-green-500 cursor-pointer"
                  onClick={executeRequest}
                />
              )}
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
