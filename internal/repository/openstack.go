package repository

import (
	"context"

	"github.com/gophercloud/gophercloud"
	"github.com/gophercloud/gophercloud/openstack"
	"github.com/gophercloud/gophercloud/openstack/compute/v2/flavors"
	"github.com/gophercloud/gophercloud/openstack/compute/v2/images"
	"github.com/gophercloud/gophercloud/openstack/networking/v2/extensions/security/groups"
	"github.com/gophercloud/gophercloud/openstack/networking/v2/networks"
)

type OpenStackRepository struct {
	provider *gophercloud.ProviderClient
}

func NewOpenStackRepository(authOptions gophercloud.AuthOptions) (*OpenStackRepository, error) {
	provider, err := openstack.AuthenticatedClient(authOptions)
	if err != nil {
		return nil, err
	}
	return &OpenStackRepository{provider: provider}, nil
}

func (r *OpenStackRepository) ListFlavors(ctx context.Context) ([]flavors.Flavor, error) {
	client, err := openstack.NewComputeV2(r.provider, gophercloud.EndpointOpts{})
	if err != nil {
		return nil, err
	}

	allPages, err := flavors.ListDetail(client, nil).AllPages()
	if err != nil {
		return nil, err
	}

	return flavors.ExtractFlavors(allPages)
}

func (r *OpenStackRepository) ListImages(ctx context.Context) ([]images.Image, error) {
	client, err := openstack.NewComputeV2(r.provider, gophercloud.EndpointOpts{})
	if err != nil {
		return nil, err
	}

	allPages, err := images.ListDetail(client, nil).AllPages()
	if err != nil {
		return nil, err
	}

	return images.ExtractImages(allPages)
}

func (r *OpenStackRepository) ListNetworks(ctx context.Context) ([]networks.Network, error) {
	client, err := openstack.NewNetworkV2(r.provider, gophercloud.EndpointOpts{})
	if err != nil {
		return nil, err
	}

	allPages, err := networks.List(client, nil).AllPages()
	if err != nil {
		return nil, err
	}

	return networks.ExtractNetworks(allPages)
}

func (r *OpenStackRepository) ListSecurityGroups(ctx context.Context) ([]groups.SecGroup, error) {
	client, err := openstack.NewNetworkV2(r.provider, gophercloud.EndpointOpts{})
	if err != nil {
		return nil, err
	}

	allPages, err := groups.List(client, groups.ListOpts{}).AllPages()
	if err != nil {
		return nil, err
	}

	return groups.ExtractGroups(allPages)
}
